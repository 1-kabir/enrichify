import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { User } from '../entities/user.entity';
import { UserApiKey } from '../entities/user-api-key.entity';
import { WebsetsModule } from '../websets/websets.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserApiKey]),
        WebsetsModule,
    ],
    controllers: [UsersController, ProfileController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
