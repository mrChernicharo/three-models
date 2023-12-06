import * as THREE from "three";
import { animationActions, animationIdx, displayAnimationName, mixer, onActionFinished } from "./character";

export function onCharacterStateChange(e) {
  const { currentState, previousState } = e.detail;
  console.log({ currentState, previousState });

  const currentAnimationAction = animationActions[animationIdx[currentState]];
  const previousAnimationAction = animationActions[animationIdx[previousState]];

  console.log({ currentAnimationAction, previousAnimationAction });
  displayAnimationName(currentAnimationAction._clip.name);

  if (currentAnimationAction._clip.name === "Jump") {
    currentAnimationAction.loop = THREE.LoopOnce;
    currentAnimationAction.clampWhenFinished = true;

    // previousAnimationAction.fadeOut(0.2);
    // const jump = currentAnimationAction.reset().fadeIn(0.2).play();
    // previousAnimationAction.crossFadeTo(currentAnimationAction, 0.2);
    mixer.addEventListener("finished", onActionFinished);
  } else {
    previousAnimationAction.fadeOut(0.5);
    currentAnimationAction.reset().fadeIn(0.5).play();
    // previousAnimationAction.crossFadeTo(currentAnimationAction, 0.5)
  }
}
