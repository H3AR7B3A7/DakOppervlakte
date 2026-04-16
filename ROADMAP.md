# ROADMAP

- [x] Save the perspective (tilt x cardinal) with the selections / only show selections in the orientation it was created in / use eye icons to indicate if the layer is visible or not in the sidepanel
- [x] Test coverage
- [x] Belgium is supposed to have a register of polygons that we can get for the addresses (there's a new api?), so we can autogenerate a selection of the roof, the coordinates don't match exactly, so we might have to allow values within a diamond shape or something when trying to detect the actual building, under the address search set a checkbox to auto generate.
- [ ] Sidebar is overall too large and growing, making the map bigger than the screen, it should always fit the screen, add a scrollbar for the selection
- [ ] Mobile support: Sidebar hamburger, with toggles for the layers
- [ ] Remove the init endpoint / scripts / ... decent versioning?
- [ ] Add github action that runs `build` and `test` in package.json
- [ ] Add pre commit hook that runs `check` and `test` in package.json
- [ ] https://dak-oppervlakte.vercel.app/ in README + overall update
- [ ] Use Biome instead of eslint/prettier, set good rules, vercel / nextjs / no semicolons
- [ ] Use linting to implement architecture rules (direction of dependencies)
- [ ] Implement e2e tests with playwright (document CLAUDE/GEMINI/README)
- [ ] Add Storybook for the pure ui components (document CLAUDE/GEMINI/README) and add chromatic visual checks to the github pr process
