import { Expose } from 'class-transformer';
import { IsString, MaxLength, IsEnum, IsObject, IsBoolean, IsOptional } from 'class-validator';
import { DocumentTemplateType } from '../documentTemplateModel';

export class UpdateTemplateDto {
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Template name must not exceed 255 characters.' })
  name?: string;

  @Expose()
  @IsOptional()
  @IsEnum(DocumentTemplateType, { message: 'Type must be INVOICE or PURCHASE_ORDER.' })
  type?: DocumentTemplateType;

  @Expose()
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @Expose()
  @IsOptional()
  @IsObject()
  headerConfig?: Record<string, any>;

  @Expose()
  @IsOptional()
  @IsObject()
  footerConfig?: Record<string, any>;

  @Expose()
  @IsOptional()
  @IsObject()
  tableConfig?: Record<string, any>;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
