import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";

let gui; //GUI
let fileUrl; //URL
let glTFLoader; //GLTFLoader
let renderer; //THREE.WebGLRenderer
let scene; //THREE.Scene
let camera;
let orbit;
let ambientLight;
let mixer;
let currAnimationIdx = 3;

const baseURL = "/assets/Character_Hazmat.gltf";
const animationActions = [];
const keysPressed = {};

let currentState = "Idle";
let previousState = "Idle";

function setup() {
  gui = new GUI();
  fileUrl = new URL(baseURL, import.meta.url);
  glTFLoader = new GLTFLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xcbcbcb); // Sets the color of the background
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  orbit = new OrbitControls(camera, renderer.domElement); // Sets orbit control to move the camera around
  camera.position.set(5, 10, 15); // Camera positioning
  orbit.update();

  ambientLight = new THREE.AmbientLight(0xefefef, 0.9);
  scene.add(ambientLight);
}

function drawGrid() {
  // Sets a 12 by 12 gird helper
  const gridHelper = new THREE.GridHelper(12, 12);
  scene.add(gridHelper);

  // Sets the x, y, and z axes with each having a length of 4
  const axesHelper = new THREE.AxesHelper(14);
  scene.add(axesHelper);
}

async function loadModel() {
  const gltf = await glTFLoader.loadAsync(fileUrl.href);
  const { scene: model, animations } = gltf;
  scene.add(model);

  console.log({ gltf, model, animations });

  setupMixerAndActions(model, animations);

  //   equipGun(model, "Knife_1");
  equipGun(model, "Knife_2");
  //   equipGun(model, "Revolver");
  //   equipGun(model, "Shovel");
}

function setupMixerAndActions(model, animations) {
  mixer = new THREE.AnimationMixer(model);

  for (const animationClip of animations) {
    console.log(animationClip.name);
    const action = mixer.clipAction(animationClip);
    animationActions.push(action);
  }

  console.log(animationActions);
}

function equipGun(model, gunName) {
  console.log("======================");
  const handObject = model.getObjectByName("Index1R");
  [...handObject.children].forEach((gunObj) => {
    console.log(gunObj.name);
    if (gunObj.name !== gunName) {
      gunObj.visible = false;
    }
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyUp(e) {
  keysPressed[e.key] = false;

  if (Object.values(keysPressed).every((v) => v === false)) {
    currentState = "Idle";
  } else if (e.key === " " && Object.values(keysPressed).some((v) => v === true)) {
    currentState = "Walk";
  } else if (e.key !== " " && keysPressed[" "]) {
    currentState = "Idle";
  }

  if (previousState !== currentState) {
    // console.log("changed state", previousState, " => ", currentState);
    window.dispatchEvent(new CustomEvent("character-state-change", { detail: { currentState, previousState } }));
    previousState = currentState;
  }
}

function onKeyDown(e) {
  if (["a", "w", "s", "d", " "].includes(e.key)) {
    if (e.key === " ") {
      if (Object.entries(keysPressed).some(([k, isPressed]) => k !== " " && isPressed)) {
        currentState = "Run";
      } else {
        currentState = "Idle";
      }
    } else {
      if (keysPressed[" "]) {
        currentState = "Run";
      } else {
        currentState = "Walk";
      }
    }

    if (previousState !== currentState) {
      //   console.log("changed state", previousState, " => ", currentState);
      window.dispatchEvent(new CustomEvent("character-state-change", { detail: { currentState, previousState } }));
      previousState = currentState;
    }

    keysPressed[e.key] = true;
  }
}

function onCharacterStateChange(e) {
  const { currentState, previousState } = e.detail;
  console.log({ currentState, previousState });

  const animationIdx = {
    Idle: 3,
    Run: 10,
    Walk: 13,
  };

  const currentAnimationAction = animationActions[animationIdx[currentState]];
  const previousAnimationAction = animationActions[animationIdx[previousState]];

  console.log({ currentAnimationAction, previousAnimationAction });

  previousAnimationAction.fadeOut(0.4);
  currentAnimationAction.reset().fadeIn(0.4).play();
  //   previousAnimationAction.stop();
  //   currentAnimationAction.play();

  //   13 Walk
  //   10 Run
  //   3 Idle

  //     let prevAnimationIdx = currAnimationIdx % animationActions.length;
  //     currAnimationIdx = (prevAnimationIdx + 1) % animationActions.length;

  //     let previousAnimation = animationActions[prevAnimationIdx];
  //     let currentAnimation = animationActions[currAnimationIdx];

  //     console.log(`Current animation: ${currentAnimation._clip.name}`, { currentAnimation });

  //     displayAnimationName(currentAnimation);

  //     if (currentAnimation._clip.name === "Death") {
  //       //   currentAnimation.repetitions = 1;
  //       currentAnimation.loop = THREE.LoopOnce;
  //       currentAnimation.clampWhenFinished = true;
  //     }

  //     previousAnimation?.fadeOut(0.5);
  //     currentAnimation.reset().fadeIn(0.5).play();
}

export async function runCharacterDemo() {
  setup();

  drawGrid();

  await loadModel();

  animationActions[currAnimationIdx].reset().fadeIn(0.5).play();
  displayAnimationName(animationActions[currAnimationIdx]);

  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", onResize);

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  window.addEventListener("character-state-change", onCharacterStateChange);
}

function displayAnimationName(currentAnimation) {
  const textDisplay = document.querySelector("#text-display");
  textDisplay.innerHTML = currentAnimation._clip.name;
}

const clock = new THREE.Clock();
function animate() {
  // mixer.update()   => updates mixer and animations times
  // clock.getDelta() => Get the seconds passed since the time .oldTime was set and sets .oldTime to the current time
  //   console.log(currentState, keysPressed);

  mixer.update(clock.getDelta());

  renderer.render(scene, camera);
}
