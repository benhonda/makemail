import { Config } from "@makemail/core";

export type CLIConfig = {
  emailUrlTagName: string;
  defaultFileName: string;
  files: string[];
} & Config;
