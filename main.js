import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const fileUrl = new URL("/assets/Donkey.gltf", import.meta.url);
console.log(fileUrl);

const glTFLoader = new GLTFLoader();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background
renderer.setClearColor(0xcbcbcb);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Sets orbit control to move the camera around
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning
camera.position.set(5, 10, 15);
orbit.update();

const ambientLight = new THREE.AmbientLight(0xefefef, 0.9);
scene.add(ambientLight);

// Sets a 12 by 12 gird helper
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

// Sets the x, y, and z axes with each having a length of 4
const axesHelper = new THREE.AxesHelper(14);
scene.add(axesHelper);

// glTFLoader.load(fileUrl.href, (gltf) => {
//   const model = gltf.scene;
//   scene.add(model);

//   console.log({ gltf, model });
// });

glTFLoader.loadAsync(fileUrl.href).then((gltf) => {
  const model = gltf.scene;
  scene.add(model);

  console.log({ gltf, model });
});

function animate() {
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
