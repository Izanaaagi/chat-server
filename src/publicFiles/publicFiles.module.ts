import { Module } from '@nestjs/common';
import { PublicFilesService } from './publicFiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import PublicFile from './publicFile.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([PublicFile]), ConfigModule],
  providers: [PublicFilesService],
  exports: [PublicFilesService],
})
export class PublicFilesModule {}
