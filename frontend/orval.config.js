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
            tsconfig: "./tsconfig.json",
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

