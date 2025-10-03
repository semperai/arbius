export interface ModelTemplate {
  meta: {
    title: string
    description: string
    git?: string
    docker: string
    version: number
  }
  input: InputField[]
  output: OutputField[]
}

export interface InputField {
  variable: string
  type: 'string' | 'int' | 'int_enum' | 'float' | 'bool'
  required: boolean
  default?: string | number | boolean
  description: string
  choices?: number[] | string[]
}

export interface OutputField {
  filename: string
  type: 'image' | 'text' | 'video' | 'audio'
}
