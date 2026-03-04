import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateStageInput {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'Stage name must not exceed 100 characters' })
  name!: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Entity type must not exceed 50 characters' })
  entityType!: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Color must not exceed 20 characters' })
  color?: string;

  @Expose()
  @IsOptional()
  @IsNumber({}, { message: 'Probability must be a number' })
  @Min(0, { message: 'Probability must be at least 0' })
  @Max(100, { message: 'Probability must not exceed 100' })
  probability?: number;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  isLost?: boolean;
}
