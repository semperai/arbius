export interface TemplateInput {
  variable: string;
  type: "string"|"string_enum"|"int"|"int_enum"|"decimal";
  required: boolean;
  min?: number;
  max?: number;
  choices?: string[]|number[];
  default: string|number;
  description: string;
}

export interface TemplateOutput {
  filename: string;
  type: string;
}

export interface Template {
  meta: {
    title: string;
    description: string;
    git: string;
    docker: string;
  }
  input: TemplateInput[];
  output: TemplateOutput[];
}
