import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    UseGuards,
    Request,
    ValidationPipe,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { WebsetsService } from '../websets/websets.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AuthUtils } from '../utils/auth.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(
        private usersService: UsersService,
        private websetsService: WebsetsService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    @Get()
    async getProfile(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    @Patch('password')
    async changePassword(
        @Request() req,
        @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    ) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

        if (newPassword !== confirmPassword) {
            throw new BadRequestException('New passwords do not match');
        }

        const user = await this.userRepository.findOne({
            where: { id: req.user.id },
            select: ['id', 'password'],
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isMatch = await AuthUtils.comparePasswords(
            currentPassword,
            user.password,
        );

        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        await this.usersService.update(user.id, { password: newPassword });

        return { message: 'Password changed successfully' };
    }

    @Delete()
    async deleteAccount(@Request() req) {
        await this.websetsService.removeAllForUser(req.user.id);
        await this.usersService.remove(req.user.id);
        return { message: 'Account deleted successfully' };
    }

    @Delete('websets')
    async wipeWebsets(@Request() req) {
        await this.websetsService.removeAllForUser(req.user.id);
        return { message: 'All websets have been wiped' };
    }
}
