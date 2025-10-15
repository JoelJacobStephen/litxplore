module.exports = {
    litxplore: {
        input: {
            target: "./openapi.json",
        },
        output: {
            mode: "tags-split",
            target: "./src/lib/api/generated/api.ts",
            schemas: "./src/lib/api/generated/models",
            client: "react-query",
            tsconfig: "./tsconfig.json",
            clean: false,
            override: {
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
    },
};

