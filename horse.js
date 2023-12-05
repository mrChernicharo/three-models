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
let currAnimationIdx = -1;

const baseURL = "/assets/Horse_White.gltf";
const animationActions = [];

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

  mixer = new THREE.AnimationMixer(model);

  for (const animationClip of animations) {
    const action = mixer.clipAction(animationClip);
    animationActions.push(action);
  }

  //   const walkClip = ANIMATIONS["Walk"];
  //   const gallopClip = ANIMATIONS["Gallop"];

  //   walkAction = mixer.clipAction(walkClip);
  //   gallopAction = mixer.clipAction(gallopClip);
  //   walkAction.play();
  //   //   gallopAction.play();

  //   console.log(ANIMATIONS, mixer);
}

export async function runHorseDemo() {
  setup();

  drawGrid();

  await loadModel();

  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("click", function () {
    let prevAnimationIdx = currAnimationIdx % animationActions.length;
    currAnimationIdx = (prevAnimationIdx + 1) % animationActions.length;

    let previousAnimation = animationActions[prevAnimationIdx];
    let currentAnimation = animationActions[currAnimationIdx];

    console.log(`Current animation: ${currentAnimation._clip.name}`, { currentAnimation });

    previousAnimation?.stop();
    currentAnimation.play();
  });
}

const clock = new THREE.Clock();
function animate() {
  // mixer.update()   => updates mixer and animations times
  // clock.getDelta() => Get the seconds passed since the time .oldTime was set and sets .oldTime to the current time
  mixer.update(clock.getDelta());

  renderer.render(scene, camera);
}
