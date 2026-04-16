import "./index.css";
import { xiaomiSU7Compositions } from "./videos/xiaomi-su7";

/**
 * Root registry — each video exports its own <Folder> of compositions.
 *
 * To add a new video:
 *   1. Create src/videos/<slug>/ with components/, data/, index.tsx
 *   2. Create public/<slug>/ with audio/ and videos/
 *   3. Import and render the video's composition function here
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {xiaomiSU7Compositions()}
      {/* Future videos go here:
        {teslaFSDCompositions()}
        {bydOceanCompositions()}
      */}
    </>
  );
};
