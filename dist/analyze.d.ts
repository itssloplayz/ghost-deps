declare function analyzeProject(root?: string, opts?: {
    patterns?: string[];
}): Promise<{
    ghosts: string[];
    phantoms: string[];
    devUsedInProd: {
        [k: string]: string[];
    };
}>;

export { analyzeProject };
