import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export enum DocSortByEnum {
  title = 'title',
  reference = 'reference',
  type = 'type',
  status = 'status',
  total = 'total',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt'
}

export class GetDocsInput {
  @Expose()
  @IsOptional()
  @IsString()
  page?: string;

  @Expose()
  @IsOptional()
  @IsString()
  limit?: string;

  @Expose()
  @IsOptional()
  @IsString()
  searchKey?: string;

  @Expose()
  @IsOptional()
  @IsString()
  sort?: string;

  @Expose()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Expose()
  @IsOptional()
  type?: string | string[];

  @Expose()
  @IsOptional()
  status?: string | string[];

  @Expose()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  toDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  clientName?: string;
}
