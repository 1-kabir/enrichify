import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebsetCitation } from '../entities/webset-citation.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { CreateCitationDto } from './dto/create-citation.dto';

@Injectable()
export class CitationsService {
  constructor(
    @InjectRepository(WebsetCitation)
    private citationRepository: Repository<WebsetCitation>,
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
  ) {}

  async create(createCitationDto: CreateCitationDto): Promise<WebsetCitation> {
    const cell = await this.cellRepository.findOne({
      where: { id: createCitationDto.cellId },
    });

    if (!cell) {
      throw new NotFoundException(`Cell with ID ${createCitationDto.cellId} not found`);
    }

    const citation = this.citationRepository.create(createCitationDto);
    return this.citationRepository.save(citation);
  }

  async findByCellId(cellId: string): Promise<WebsetCitation[]> {
    return this.citationRepository.find({
      where: { cellId },
      relations: ['searchProvider'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<WebsetCitation> {
    const citation = await this.citationRepository.findOne({
      where: { id },
      relations: ['cell', 'searchProvider'],
    });

    if (!citation) {
      throw new NotFoundException(`Citation with ID ${id} not found`);
    }

    return citation;
  }

  async remove(id: string): Promise<void> {
    const citation = await this.findOne(id);
    await this.citationRepository.remove(citation);
  }

  async createBatch(citations: CreateCitationDto[]): Promise<WebsetCitation[]> {
    const createdCitations: WebsetCitation[] = [];

    for (const citationDto of citations) {
      const citation = await this.create(citationDto);
      createdCitations.push(citation);
    }

    return createdCitations;
  }
}
