import { Plugin, OutputOptions, OutputBundle } from 'rollup';
export interface ScreepsConfig {
    token?: string;
    email?: string;
    password?: string;
    protocol: "http" | "https";
    hostname: string;
    port: number;
    path: string;
    branch: string | "auto";
}
export interface ScreepsOptions {
    configFile?: string;
    config?: ScreepsConfig;
    dryRun?: boolean;
}
export interface BinaryModule {
    binary: string;
}
export interface CodeList {
    [key: string]: string | BinaryModule;
}
export declare function generateSourceMaps(bundle: OutputBundle): void;
export declare function writeSourceMaps(options: OutputOptions): void;
export declare function validateConfig(cfg: Partial<ScreepsConfig>): cfg is ScreepsConfig;
export declare function loadConfigFile(configFile: string): ScreepsConfig;
export declare function uploadSource(config: string | ScreepsConfig, options: OutputOptions, bundle: OutputBundle): void;
export declare function runUpload(api: any, branch: string, code: CodeList): void;
export declare function getFileList(outputFile: string): CodeList;
export declare function getBranchName(branch: string): string;
export declare function screeps(screepsOptions?: ScreepsOptions): Plugin;
export default screeps;
