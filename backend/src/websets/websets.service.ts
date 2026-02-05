import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Webset, WebsetStatus } from '../entities/webset.entity';
import { WebsetVersion } from '../entities/webset-version.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { CreateWebsetDto } from './dto/create-webset.dto';
import { UpdateWebsetDto } from './dto/update-webset.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { RevertVersionDto } from './dto/revert-version.dto';

// Import csv-parser without types
const csvParser = require('csv-parser');

@Injectable()
export class WebsetsService {
    constructor(
        @InjectRepository(Webset)
        private websetRepository: Repository<Webset>,
        @InjectRepository(WebsetVersion)
        private versionRepository: Repository<WebsetVersion>,
        @InjectRepository(WebsetCell)
        private cellRepository: Repository<WebsetCell>,
    ) { }

    async create(createWebsetDto: CreateWebsetDto, userId: string): Promise<Webset> {
        const webset = this.websetRepository.create({
            ...createWebsetDto,
            userId,
            status: createWebsetDto.status || WebsetStatus.DRAFT,
            currentVersion: 1,
            rowCount: 0,
        });

        const savedWebset = await this.websetRepository.save(webset);

        await this.createVersion(savedWebset, userId, 'Initial version');

        return savedWebset;
    }

    async findAll(userId: string): Promise<Webset[]> {
        return this.websetRepository.find({
            where: { userId },
            order: { updatedAt: 'DESC' },
        });
    }

    async findOne(id: string, userId: string): Promise<Webset> {
        const webset = await this.websetRepository.findOne({
            where: { id },
            relations: ['versions', 'cells', 'cells.citations'],
        });

        if (!webset) {
            throw new NotFoundException(`Webset with ID ${id} not found`);
        }

        if (webset.userId !== userId) {
            throw new ForbiddenException('You do not have access to this webset');
        }

        return webset;
    }

    async update(id: string, updateWebsetDto: UpdateWebsetDto, userId: string): Promise<Webset> {
        const webset = await this.findOne(id, userId);

        Object.assign(webset, updateWebsetDto);

        const savedWebset = await this.websetRepository.save(webset);

        await this.createVersion(savedWebset, userId, 'Webset metadata updated');

        return savedWebset;
    }

    async remove(id: string, userId: string): Promise<void> {
        const webset = await this.findOne(id, userId);
        await this.websetRepository.remove(webset);
    }

    async updateCell(
        websetId: string,
        updateCellDto: UpdateCellDto,
        userId: string,
    ): Promise<WebsetCell> {
        const webset = await this.findOne(websetId, userId);

        const columnExists = webset.columnDefinitions.some(
            (col) => col.id === updateCellDto.column,
        );

        if (!columnExists) {
            throw new BadRequestException(`Column ${updateCellDto.column} does not exist in webset`);
        }

        let cell = await this.cellRepository.findOne({
            where: {
                websetId,
                row: updateCellDto.row,
                column: updateCellDto.column,
            },
        });

        if (!cell) {
            cell = this.cellRepository.create({
                websetId,
                row: updateCellDto.row,
                column: updateCellDto.column,
            });
        }

        cell.value = updateCellDto.value ?? cell.value;
        cell.confidenceScore = updateCellDto.confidenceScore ?? cell.confidenceScore;
        cell.metadata = updateCellDto.metadata ?? cell.metadata;

        const savedCell = await this.cellRepository.save(cell);

        const maxRow = await this.cellRepository
            .createQueryBuilder('cell')
            .select('MAX(cell.row)', 'max')
            .where('cell.websetId = :websetId', { websetId })
            .getRawOne();

        webset.rowCount = (maxRow?.max || 0) + 1;
        webset.currentVersion += 1;
        await this.websetRepository.save(webset);

        await this.createVersion(
            webset,
            userId,
            updateCellDto.changeDescription || `Updated cell at row ${updateCellDto.row}, column ${updateCellDto.column}`,
        );

        return savedCell;
    }

    async getCells(websetId: string, userId: string): Promise<WebsetCell[]> {
        await this.findOne(websetId, userId);

        return this.cellRepository.find({
            where: { websetId },
            relations: ['citations', 'citations.searchProvider'],
            order: { row: 'ASC', column: 'ASC' },
        });
    }

    async getVersions(websetId: string, userId: string): Promise<WebsetVersion[]> {
        await this.findOne(websetId, userId);

        return this.versionRepository.find({
            where: { websetId },
            relations: ['user'],
            order: { version: 'DESC' },
        });
    }

    async revertToVersion(
        websetId: string,
        revertVersionDto: RevertVersionDto,
        userId: string,
    ): Promise<Webset> {
        const webset = await this.findOne(websetId, userId);

        let version;
        if (revertVersionDto.versionId) {
            // Look up by version ID
            version = await this.versionRepository.findOne({
                where: {
                    id: revertVersionDto.versionId,
                    websetId,
                },
            });
        } else {
            // Look up by version number
            version = await this.versionRepository.findOne({
                where: {
                    websetId,
                    version: revertVersionDto.version,
                },
            });
        }

        if (!version) {
            const identifier = revertVersionDto.versionId || revertVersionDto.version;
            throw new NotFoundException(
                `Version ${identifier} not found for webset ${websetId}`,
            );
        }

        await this.cellRepository.delete({ websetId });

        if (version.data && version.data.cells) {
            for (const cellData of version.data.cells) {
                const cell = this.cellRepository.create({
                    ...cellData,
                    websetId,
                });
                await this.cellRepository.save(cell);
            }
        }

        webset.currentVersion += 1;
        const savedWebset = await this.websetRepository.save(webset);

        await this.createVersion(
            savedWebset,
            userId,
            revertVersionDto.changeDescription || `Reverted to version ${version.version}`,
        );

        return savedWebset;
    }

    async removeAllForUser(userId: string): Promise<void> {
        const websets = await this.websetRepository.find({ where: { userId } });
        await this.websetRepository.remove(websets);
    }

    private async createVersion(
        webset: Webset,
        userId: string,
        changeDescription: string,
    ): Promise<WebsetVersion> {
        const cells = await this.cellRepository.find({
            where: { websetId: webset.id },
        });

        const version = this.versionRepository.create({
            websetId: webset.id,
            version: webset.currentVersion,
            data: {
                name: webset.name,
                description: webset.description,
                columnDefinitions: webset.columnDefinitions,
                status: webset.status,
                cells: cells.map((cell) => ({
                    row: cell.row,
                    column: cell.column,
                    value: cell.value,
                    confidenceScore: cell.confidenceScore,
                    metadata: cell.metadata,
                })),
            },
            changedBy: userId,
            changeDescription,
        });

        return this.versionRepository.save(version);
    }

    async createSnapshot(
        websetId: string,
        userId: string,
        changeDescription: string,
    ): Promise<WebsetVersion> {
        const webset = await this.findOne(websetId, userId);

        // Increment version number for the snapshot
        webset.currentVersion += 1;
        await this.websetRepository.save(webset);

        return this.createVersion(webset, userId, changeDescription);
    }

    async importFromFile(file: Express.Multer.File, userId: string): Promise<Webset> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file type
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            throw new BadRequestException(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Parse the file based on its extension
        let data: any[] = [];
        
        try {
            if (fileExtension === '.csv') {
                data = await this.parseCsvFile(file.path);
            } else {
                data = await this.parseExcelFile(file.buffer);
            }
        } catch (error) {
            throw new BadRequestException(`Error parsing file: ${error.message}`);
        }

        if (!data || data.length === 0) {
            throw new BadRequestException('File is empty or contains no valid data');
        }

        // Create a new webset with the first few rows of data
        const firstRow = data[0];
        const columnNames = Object.keys(firstRow);
        
        // Create column definitions from the headers
        const columnDefinitions = columnNames.map((name, index) => ({
            id: `col_${index}_${Date.now()}`, // Generate unique IDs
            name: name,
            type: 'string', // Default to string type, could be enhanced to detect types
        }));

        // Create the webset
        const createWebsetDto: CreateWebsetDto = {
            name: path.basename(file.originalname, fileExtension) || 'Imported Webset',
            description: `Imported from ${file.originalname}`,
            columnDefinitions,
            status: WebsetStatus.ACTIVE,
        };

        const webset = await this.create(createWebsetDto, userId);

        // Insert the data into the webset
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const rowData = data[rowIndex];
            
            for (const [colIndex, columnName] of columnNames.entries()) {
                const columnDef = columnDefinitions[colIndex];
                
                if (columnDef && rowData[columnName] !== undefined) {
                    await this.updateCell(
                        webset.id,
                        {
                            row: rowIndex,
                            column: columnDef.id,
                            value: String(rowData[columnName]),
                        },
                        userId
                    );
                }
            }
        }

        // Update row count
        webset.rowCount = data.length;
        await this.websetRepository.save(webset);

        return webset;
    }

    private parseCsvFile(filePath: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = fs.createReadStream(filePath).pipe(csvParser());

            stream.on('data', (data) => results.push(data));
            stream.on('end', () => {
                // Clean up the temporary file
                fs.unlinkSync(filePath);
                resolve(results);
            });
            stream.on('error', (error) => {
                // Clean up the temporary file
                fs.unlinkSync(filePath);
                reject(error);
            });
        });
    }

    private parseExcelFile(buffer: Buffer): Promise<any[]> {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0]; // Use the first sheet
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            
            return Promise.resolve(jsonData);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async verifyWebset(
        websetId: string,
        userId: string,
    ): Promise<any> {
        const webset = await this.findOne(websetId, userId);

        // Perform basic verification checks
        const cells = await this.cellRepository.find({
            where: { websetId: webset.id },
        });

        // Check for orphaned cells (cells pointing to non-existent columns)
        const validColumnIds = webset.columnDefinitions.map(col => col.id);
        const orphanedCells = cells.filter(cell => !validColumnIds.includes(cell.column));

        // Check for data type consistency
        const typeMismatchIssues = [];
        for (const cell of cells) {
            const columnDef = webset.columnDefinitions.find(col => col.id === cell.column);
            if (columnDef && columnDef.type) {
                const dataTypeValid = this.validateDataType(cell.value, columnDef.type);
                if (!dataTypeValid) {
                    typeMismatchIssues.push({
                        cellId: cell.id,
                        row: cell.row,
                        column: cell.column,
                        value: cell.value,
                        expectedType: columnDef.type,
                        actualType: typeof cell.value,
                    });
                }
            }
        }

        // Check for duplicate rows (based on all values in a row)
        const rowValuesMap = new Map<string, number[]>();
        for (const cell of cells) {
            const rowKey = `${cell.row}`;
            if (!rowValuesMap.has(rowKey)) {
                rowValuesMap.set(rowKey, []);
            }
            rowValuesMap.get(rowKey).push(cell.row);
        }

        // Check for missing required fields
        const requiredColumns = webset.columnDefinitions.filter(col => col.required);
        const missingRequiredFields = [];
        for (const cell of cells) {
            const columnDef = requiredColumns.find(col => col.id === cell.column);
            if (columnDef && (!cell.value || cell.value.toString().trim() === '')) {
                missingRequiredFields.push({
                    row: cell.row,
                    column: cell.column,
                    columnName: columnDef.name,
                });
            }
        }

        return {
            websetId,
            isValid: orphanedCells.length === 0 && typeMismatchIssues.length === 0 && missingRequiredFields.length === 0,
            issues: {
                orphanedCells: orphanedCells.length,
                typeMismatches: typeMismatchIssues.length,
                missingRequiredFields: missingRequiredFields.length,
            },
            details: {
                orphanedCells,
                typeMismatches: typeMismatchIssues,
                missingRequiredFields,
            },
            timestamp: new Date(),
        };
    }

    private validateDataType(value: any, expectedType: string): boolean {
        if (value === null || value === undefined) return true; // Allow null values

        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return typeof value === 'string' && emailRegex.test(value);
            default:
                return true; // Skip validation for unknown types
        }
    }
}
