import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
test('inner layers cannot import React, UI, or infrastructure adapters', () => {
  for (const layer of ['domain', 'application']) {
    for (const file of readdirSync(`src/${layer}`)) {
      if (!file.endsWith('.ts')) continue;
      const source = readFileSync(join('src', layer, file), 'utf8');
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
        (match) => match[1],
      );
      for (const dependency of imports)
        assert.ok(
          !/react|presentation|infrastructure/.test(dependency),
          `${layer}/${file} crosses dependency boundary: ${dependency}`,
        );
    }
  }
});
test('presentation and inner layers never import adapters or the server', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(dir, entry.name))
        : /\.tsx?$/.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );
  for (const layer of ['domain', 'application', 'presentation'])
    for (const file of files(join('src', layer))) {
      const source = readFileSync(file, 'utf8');
      for (const [, dependency] of source.matchAll(/from\s+['"]([^'"]+)['"]/g))
        assert.ok(
          !/infrastructure|\/server\//.test(dependency),
          `${file} imports ${dependency}; wire adapters in src/app.tsx`,
        );
    }
});
