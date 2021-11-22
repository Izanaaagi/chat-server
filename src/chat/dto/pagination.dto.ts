import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, type: Number })
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @ApiProperty({ required: false, type: Number })
  take?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  keyWord?: string;
}
