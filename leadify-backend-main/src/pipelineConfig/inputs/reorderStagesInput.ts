import { Expose } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReorderStagesInput {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Entity type must not exceed 50 characters' })
  entityType!: string;

  @Expose()
  @IsArray()
  @ArrayNotEmpty({ message: 'stageIds must not be empty' })
  @IsString({ each: true, message: 'Each stage ID must be a string' })
  stageIds!: string[];
}
