import { Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateStageInput {
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Stage name must not exceed 100 characters' })
  name?: string;

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

  @Expose()
  @IsOptional()
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(1, { message: 'Order must be at least 1' })
  order?: number;
}
