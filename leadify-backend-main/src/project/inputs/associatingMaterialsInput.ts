import { Expose } from 'class-transformer';
import { ArrayMinSize, IsInt, IsOptional, IsObject, IsDefined, IsPositive, Max, Min } from 'class-validator';
class MaterialItem {
  @Expose()
  @IsInt()
  @IsPositive()
  id!: number;

  @Expose()
  @IsInt()
  @IsPositive()
  quantity!: number;

  @Expose()
  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;
}

export class AssociatingMaterialsToProjectInput {
  @Expose()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  materialsIds!: number[];

  @Expose()
  @IsInt()
  @Min(0)
  @Max(100)
  materialMargin!: number;

  @Expose()
  @IsDefined()
  @IsObject()
  // @ValidateNested({ each: true })
  // @Type(() => MaterialItem)
  additionalMaterialItems!: Record<number, MaterialItem[]>;
}
