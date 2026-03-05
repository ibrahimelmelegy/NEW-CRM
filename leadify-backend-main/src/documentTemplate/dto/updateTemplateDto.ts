import { Expose } from 'class-transformer';
import { IsString, MaxLength, IsEnum, IsObject, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { DocumentTemplateType } from '../documentTemplateModel';

export class UpdateTemplateDto {
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Template name must not exceed 255 characters.' })
  name?: string;

  @Expose()
  @IsOptional()
  @IsEnum(DocumentTemplateType, { message: 'Type must be a valid document template type.' })
  type?: DocumentTemplateType;

  @Expose()
  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;

  @Expose()
  @IsOptional()
  @IsObject()
  headerConfig?: Record<string, unknown>;

  @Expose()
  @IsOptional()
  @IsObject()
  footerConfig?: Record<string, unknown>;

  @Expose()
  @IsOptional()
  @IsObject()
  tableConfig?: Record<string, unknown>;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Email template fields
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @Expose()
  @IsOptional()
  @IsString()
  body?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @Expose()
  @IsOptional()
  @IsInt()
  @Min(0)
  usageCount?: number;
}
