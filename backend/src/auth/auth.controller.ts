import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AuthUtils } from '../utils/auth.utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body(ValidationPipe) _registerDto: RegisterDto,
  ): Promise<UserResponseDto> {
    // Public registration disabled - users must be created by admins
    throw new HttpException(
      'Public registration is disabled. Contact an administrator to create your account.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Post('login')
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<UserResponseDto> {
    return AuthUtils.toUserResponse(req.user);
  }
}
