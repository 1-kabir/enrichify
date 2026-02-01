import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsetExport, ExportFormat, ExportStatus } from '../entities/webset-export.entity';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { CreateExportDto } from './dto/create-export.dto';
import * as XLSX from 'xlsx';
import { google } from 'googleapis';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(WebsetExport)
    private exportRepository: Repository<WebsetExport>,
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
  ) {}

  async create(
    websetId: string,
    createExportDto: CreateExportDto,
    userId: string,
  ): Promise<WebsetExport> {
    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });

    if (!webset) {
      throw new NotFoundException(`Webset with ID ${websetId} not found`);
    }

    if (webset.userId !== userId) {
      throw new BadRequestException('You do not have access to this webset');
    }

    const exportRecord = this.exportRepository.create({
      websetId,
      userId,
      format: createExportDto.format,
      status: ExportStatus.PENDING,
    });

    const savedExport = await this.exportRepository.save(exportRecord);

    this.processExport(savedExport.id, createExportDto.googleAccessToken).catch((error) => {
      this.updateExportStatus(savedExport.id, ExportStatus.FAILED, error.message);
    });

    return savedExport;
  }

  async findAll(userId: string): Promise<WebsetExport[]> {
    return this.exportRepository.find({
      where: { userId },
      relations: ['webset'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<WebsetExport> {
    const exportRecord = await this.exportRepository.findOne({
      where: { id },
      relations: ['webset'],
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export with ID ${id} not found`);
    }

    if (exportRecord.userId !== userId) {
      throw new BadRequestException('You do not have access to this export');
    }

    return exportRecord;
  }

  private async processExport(exportId: string, googleAccessToken?: string): Promise<void> {
    await this.updateExportStatus(exportId, ExportStatus.PROCESSING);

    const exportRecord = await this.exportRepository.findOne({
      where: { id: exportId },
      relations: ['webset'],
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export with ID ${exportId} not found`);
    }

    const cells = await this.cellRepository.find({
      where: { websetId: exportRecord.websetId },
      order: { row: 'ASC' },
    });

    const data = this.transformCellsToTable(exportRecord.webset, cells);

    let exportUrl: string;

    switch (exportRecord.format) {
      case ExportFormat.CSV:
        exportUrl = await this.exportToCSV(data, exportRecord.webset.name);
        break;
      case ExportFormat.XLSX:
        exportUrl = await this.exportToXLSX(data, exportRecord.webset.name);
        break;
      case ExportFormat.GSHEET:
        if (!googleAccessToken) {
          throw new BadRequestException('Google access token is required for Google Sheets export');
        }
        exportUrl = await this.exportToGoogleSheets(data, exportRecord.webset.name, googleAccessToken);
        break;
      default:
        throw new BadRequestException(`Unsupported export format: ${exportRecord.format}`);
    }

    await this.updateExportStatus(exportId, ExportStatus.COMPLETED, null, exportUrl);
  }

  private transformCellsToTable(webset: Webset, cells: WebsetCell[]): any[][] {
    const headers = webset.columnDefinitions.map((col) => col.name);
    const rows: any[][] = [headers];

    const cellsByRow = new Map<number, Map<string, string>>();

    for (const cell of cells) {
      if (!cellsByRow.has(cell.row)) {
        cellsByRow.set(cell.row, new Map());
      }
      cellsByRow.get(cell.row).set(cell.column, cell.value || '');
    }

    const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => a - b);

    for (const rowNum of sortedRows) {
      const rowData = cellsByRow.get(rowNum);
      const row = webset.columnDefinitions.map((col) => rowData.get(col.id) || '');
      rows.push(row);
    }

    return rows;
  }

  private async exportToCSV(data: any[][], filename: string): Promise<string> {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const exportDir = join(process.cwd(), 'exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const filepath = join(exportDir, `${filename}-${Date.now()}.csv`);
    writeFileSync(filepath, csv);

    return `/exports/${filename}-${Date.now()}.csv`;
  }

  private async exportToXLSX(data: any[][], filename: string): Promise<string> {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const exportDir = join(process.cwd(), 'exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const filepath = join(exportDir, `${filename}-${Date.now()}.xlsx`);
    XLSX.writeFile(workbook, filepath);

    return `/exports/${filename}-${Date.now()}.xlsx`;
  }

  private async exportToGoogleSheets(
    data: any[][],
    title: string,
    accessToken: string,
  ): Promise<string> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${title} - ${new Date().toISOString()}`,
        },
        sheets: [
          {
            properties: {
              title: 'Data',
            },
          },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Data!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: data,
      },
    });

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  private async updateExportStatus(
    exportId: string,
    status: ExportStatus,
    errorMessage?: string,
    exportUrl?: string,
  ): Promise<void> {
    await this.exportRepository.update(exportId, {
      status,
      errorMessage,
      exportUrl,
    });
  }
}
