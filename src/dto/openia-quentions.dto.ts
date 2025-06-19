import { IsNotEmpty, IsString } from "class-validator";

export class AiQueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;
}