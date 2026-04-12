- [ ] I have been refactoring this app and adding tests. This is what I still need to do: Here's a quick status before you run:                                     
    ✅ Fully written:
    
    Vitest infrastructure (vitest.config.ts, vitest.setup.ts, updated package.json, Jest files deleted)                                                           
    Google Maps stub rewritten with vi (installed once globally, no per-test mocking)                                                                             
    README & CLAUDE.md updated with the new "mock as little as possible" rule                                                                                     
    All tests rewritten with vi instead of jest                                                                                                                   
    New tests: TotalAreaDisplay.test.tsx, SearchHistory.test.tsx
    
    ⏳ Still to write (next continue):
    
    SaveResetControls.test.tsx                                                                                                                                    
    RotationControls.test.tsx                                                                                                                                     
    DrawingOverlay.test.tsx                                                                                                                                       
    hooks/useUsageCounter.test.ts                                                                                                                                 
    hooks/useSearchHistory.test.ts                                                                                                                                
    hooks/usePolygonDrawing.test.ts                                                                                                                               
    api/counter.test.ts                                                                                                                                           
    api/searches.test.ts

- [ ] Update CLAUDE/GEMINI/README with vite changes
- [ ] Add commands to CLAUDE/GEMINI to run single test etc, and instruct to always check tsc build and run linting after a change
- [ ] Belgium is supposed to have polygons that we can get for the addresses (there's a new api?), so we can make automatic selection of a roof
- [ ] If we aren't logged in we can push a button and it says we successfully saved.
- [ ] When logged in and saving, we can't actually ever get that save back anywhere.
- [ ] Use Biome instead of eslint/prettier, set good rules, vercel / nextjs / no semicolons
- [ ] Use linting to implement architecture rules (direction of dependencies)
- [ ] Implement e2e tests with playwright (document CLAUDE/GEMINI/README)
- [ ] Add Storybook for the pure ui components (document CLAUDE/GEMINI/README) and add chromatic visual checks to the github pr process
- [ ] Remove the init endpoint?
