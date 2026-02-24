import { Expose } from 'class-transformer';
import { IsString, MaxLength, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';

export class UpdateDocInput {
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Title must not exceed 255 characters.' })
  title?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Reference must not exceed 50 characters.' })
  reference?: string;

  @Expose()
  @IsOptional()
  @IsString()
  content?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientCompany?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientEmail?: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  tax?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  total?: number;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @Expose()
  @IsOptional()
  @IsString()
  notes?: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
