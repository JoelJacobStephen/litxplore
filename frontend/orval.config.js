module.exports = {
    litxplore: {
        input: {
            target: "./openapi.json",
        },
        output: {
            mode: "tags-split",
            target: "./src/lib/api/generated",
            schemas: "./src/lib/api/generated/models",
            client: "react-query",
            mock: false,
            clean: true,
            tsconfig: "./tsconfig.json",
            indexFiles: {
                // Generate index files in each tag directory AND a root index
                // See: https://orval.dev/reference/configuration/output#indexfiles
                includeSchemasIndex: true,
            },
            override: {
                operationName: (operation, route, verb) => {
                    // Use operation_id if available, fallback to default
                    return operation.operationId || operation.operationName;
                },
                mutator: {
                    path: "./src/lib/api/axios-instance.ts",
                    name: "customInstance",
                },
                query: {
                    useQuery: true,
                    useMutation: true,
                    signal: true,
                },
            },
        },
        hooks: {
            afterAllFilesWrite: {
                command: 'node scripts/generate-api-index.js',
                injectGeneratedDirsAndFiles: false,
            },
        },
    },
};

