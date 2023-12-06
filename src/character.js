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
const animationIdx = {
  Death: 0,
  Duck: 1,
  HitReact: 2,
  Idle: 3,
  Idle_Shoot: 4,
  Jump: 5,
  Jump_Idle: 6,
  Jump_Land: 7,
  No: 8,
  Punch: 9,
  Run: 10,
  Run_Gun: 11,
  Run_Shoot: 12,
  Walk: 13,
  Walk_Shoot: 14,
  Wave: 15,
  Yes: 16,
};

let CURR_STATE = "Idle";
let PREV_STATE = "Idle";
let prevAction;

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

  equipGun(model, "Knife_1");
  //   equipGun(model, "Knife_2");
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

  console.log({ animationActions, mixer });
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
  if (e.key === " ") {
  } else {
    keysPressed[e.key.toLowerCase()] = false;
  }
  onUserInput();
}

function onKeyDown(e) {
  keysPressed[e.key.toLowerCase()] = true;
  onUserInput();
}

function onUserInput() {
  console.log(keysPressed);
  const wantsJump = keysPressed[" "];
  const isMoving = keysPressed["w"] || keysPressed["d"] || keysPressed["s"] || keysPressed["a"];
  const isShiftPressed = Boolean(keysPressed["shift"]);
  const previousState = CURR_STATE;

  if (wantsJump && !["Jump", "Jump_Idle", "Jump_Land"].includes(CURR_STATE)) {
    CURR_STATE = "Jump";
  } else if (!wantsJump && isMoving) {
    if (isShiftPressed) {
      CURR_STATE = "Run";
    } else {
      CURR_STATE = "Walk";
    }
  } else if (!wantsJump && !isMoving) {
    CURR_STATE = "Idle";
  }

  //   console.log({ isMoving, isShiftPressed, wantsJump, equalToPrev: currentState !== previousState });
  if (CURR_STATE !== previousState) {
    window.dispatchEvent(
      new CustomEvent("character-state-change", { detail: { currentState: CURR_STATE, previousState } })
    );
  }
}

function onCharacterStateChange(e) {
  const { currentState, previousState } = e.detail;
  console.log({ currentState, previousState });

  const currentAnimationAction = animationActions[animationIdx[currentState]];
  const previousAnimationAction = animationActions[animationIdx[previousState]];

  console.log({ currentAnimationAction, previousAnimationAction });
  displayAnimationName(currentAnimationAction._clip.name);

  if (currentAnimationAction._clip.name === "Jump") {
    currentAnimationAction.loop = THREE.LoopOnce;
    currentAnimationAction.clampWhenFinished = true;

    previousAnimationAction.fadeOut(0.2).stop();
    const jumpAction = currentAnimationAction.play();
    displayAnimationName(jumpAction._clip.name);

    mixer.addEventListener("finished", onActionFinished);
  } else {
    previousAnimationAction.fadeOut(0.4);
    currentAnimationAction.reset().fadeIn(0.4).play();
  }
}

function onActionFinished(e) {
  //   console.log(e, e.action._clip.name);
  mixer.stopAllAction();
  let nextAction;

  if (prevAction !== e.action) {
    if (e.action._clip.name == "Jump") {
      prevAction = e.action;
      CURR_STATE = "Jump_Idle";
      nextAction = animationActions[animationIdx[CURR_STATE]];
      nextAction.loop = THREE.LoopOnce;
      nextAction.clampWhenFinished = true;
      displayAnimationName(nextAction._clip.name);
      nextAction.play();
    }

    if (e.action._clip.name == "Jump_Idle") {
      prevAction = e.action;
      CURR_STATE = "Jump_Land";
      nextAction = animationActions[animationIdx[CURR_STATE]];
      nextAction.loop = THREE.LoopOnce;
      nextAction.clampWhenFinished = true;
      displayAnimationName(nextAction._clip.name);
      nextAction.play();
    }

    if (e.action._clip.name == "Jump_Land") {
      prevAction = e.action;
      CURR_STATE = "Idle";
      nextAction = animationActions[animationIdx[CURR_STATE]];
      displayAnimationName(nextAction._clip.name);
      nextAction.play();
      keysPressed[" "] = false;
    }
  }
}

function displayAnimationName(animationName) {
  const textDisplay = document.querySelector("#text-display");
  textDisplay.innerHTML = animationName;
}

const clock = new THREE.Clock();
function animate() {
  // mixer.update()   => updates mixer and animations times
  // clock.getDelta() => Get the seconds passed since the time .oldTime was set and sets .oldTime to the current time
  //   console.log(currentState, keysPressed);

  mixer.update(clock.getDelta());

  renderer.render(scene, camera);
}

export async function runCharacterDemo() {
  setup();

  drawGrid();

  await loadModel();

  animationActions[animationIdx["Idle"]].reset().fadeIn(0.5).play();
  displayAnimationName(animationActions[animationIdx["Idle"]]._clip.name);

  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("character-state-change", onCharacterStateChange);
}
