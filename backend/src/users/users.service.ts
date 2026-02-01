import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AuthUtils } from '../utils/auth.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password, role } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await AuthUtils.hashPassword(password);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);

    return AuthUtils.toUserResponse(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map((user) => AuthUtils.toUserResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return AuthUtils.toUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username || updateUserDto.email) {
      const whereConditions = [];
      
      if (updateUserDto.username) {
        whereConditions.push({ username: updateUserDto.username });
      }
      
      if (updateUserDto.email) {
        whereConditions.push({ email: updateUserDto.email });
      }

      const existingUser = await this.userRepository.findOne({
        where: whereConditions.length === 1 ? whereConditions[0] : whereConditions,
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username or email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await AuthUtils.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);

    const updatedUser = await this.userRepository.save(user);

    return AuthUtils.toUserResponse(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }
}
