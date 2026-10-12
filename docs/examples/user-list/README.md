# Before / after fixture

The two versions of `UserList` shown in the top-level README. Both are linted
with the `vite-react-app` template's ESLint config, so the output quoted there
can be reproduced:

```bash
T=templates/vite-react-app
cp -R docs/examples/user-list/before/src/. $T/src/
pnpm --dir $T exec eslint src/UserList.tsx      # 19 problems (16 errors, 3 warnings)
rm $T/src/UserList.tsx

cp -R docs/examples/user-list/after/src/. $T/src/
pnpm --dir $T exec eslint src/users src/shared --max-warnings 0   # no output, exit 0
rm -r $T/src/users $T/src/shared
```

The files live here rather than in the template so the template stays clean.
