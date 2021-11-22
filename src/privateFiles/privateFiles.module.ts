import { Module } from '@nestjs/common';
import { PrivateFilesService } from './privateFiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import PrivateFile from './privateFile.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([PrivateFile]), ConfigModule],
  providers: [PrivateFilesService],
  exports: [PrivateFilesService],
})
export class PrivateFilesModule {}
