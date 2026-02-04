import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webset, WebsetStatus } from '../entities/webset.entity';
import { WebsetVersion } from '../entities/webset-version.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { CreateWebsetDto } from './dto/create-webset.dto';
import { UpdateWebsetDto } from './dto/update-webset.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { RevertVersionDto } from './dto/revert-version.dto';

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

        const version = await this.versionRepository.findOne({
            where: {
                websetId,
                version: revertVersionDto.version,
            },
        });

        if (!version) {
            throw new NotFoundException(
                `Version ${revertVersionDto.version} not found for webset ${websetId}`,
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
            revertVersionDto.changeDescription || `Reverted to version ${revertVersionDto.version}`,
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
}
