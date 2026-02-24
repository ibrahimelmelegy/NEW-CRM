import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { DocStatusEnum } from '../models/docBuilderModel';

export class ChangeStatusInput {
  @Expose()
  @IsNotEmpty()
  @IsIn(Object.values(DocStatusEnum), { message: `Invalid status. Must be one of ${Object.values(DocStatusEnum).join(', ')}` })
  status!: DocStatusEnum;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
