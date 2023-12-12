import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GUI } from "dat.gui";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

let gui; //GUI
let fileUrl; //URL
// let fbxLoader; //FBXLoader
// let objLoader; //OBJLoader
let glTFLoader; //GLTFLoader
let renderer; //THREE.WebGLRenderer
let scene; //THREE.Scene
let camera;
let orbit;
let ambientLight;
let hemisphereLight;
let bricksTexture;
let stoneTexture;
let mouseRay;
let navmesh;
let pathfinding;
// let pathfindingHelper;
let agentGroup;
let navpaths = [];
let clock;
let agentGroups = [];
let pathfindingHelpers = [];
let agentBlueprints = [
  { speed: 5, pos: new THREE.Vector3(-18, 1.5, 18), color: 0xff0000 },
  { speed: 10, pos: new THREE.Vector3(18, 1.5, 18), color: 0x00ff00 },
  { speed: 20, pos: new THREE.Vector3(-18, 1.5, -18), color: 0x0000ff },
];
const baseURL = "/assets/MAZE.glb";
const ZONE_ID = "level1";

async function setup() {
  fileUrl = new URL(baseURL, import.meta.url);
  glTFLoader = new GLTFLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x232323); // Sets the color of the background
  document.body.appendChild(renderer.domElement);

  mouseRay = new THREE.Raycaster();
  gui = new GUI();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
  orbit = new OrbitControls(camera, renderer.domElement); // Sets orbit control to move the camera around
  const camFolder = gui.addFolder("Camera");
  camFolder.add(camera.position, "x", -100, 100);
  camFolder.add(camera.position, "y", -2, 20);
  camFolder.add(camera.position, "z", -100, 100);
  camera.position.x = -22;
  camera.position.z = 40;
  camera.position.y = 22.75;

  ambientLight = new THREE.AmbientLight(0xefefef, 60);
  hemisphereLight = new THREE.HemisphereLight(0xffffff);
  scene.add(ambientLight);
  scene.add(hemisphereLight);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("click", (e) => {
    let mouseClickPos = new THREE.Vector2();

    mouseClickPos.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseClickPos.y = -(e.clientY / window.innerHeight) * 2 + 1;

    mouseRay.setFromCamera(mouseClickPos, camera);
    const found = mouseRay.intersectObjects(scene.children);
    // console.log(found, agentGroup.position);
    if (!found[0]) return;
    let targetPos = found[0].point;
    console.log("click", found, targetPos);

    for (let i = 0; i < agentGroups.length; i++) {
      const agentGroup = agentGroups[i];
      const pathfindingHelper = pathfindingHelpers[i];

      let groupId = pathfinding.getGroup(ZONE_ID, agentGroup.position);

      const closestNode = pathfinding.getClosestNode(agentGroup.position, ZONE_ID, groupId);

      const path = pathfinding.findPath(closestNode.centroid, targetPos, ZONE_ID, groupId);
      if (path) {
        navpaths[i] = path;
        //   console.log({ found, navpaths, navmesh, pathfinding, targetPos, agentGroup, closest });

        if (navpaths[i]) {
          pathfindingHelper.reset();
          pathfindingHelper.setPlayerPosition(closestNode);
          pathfindingHelper.setTargetPosition(targetPos);
          pathfindingHelper.setPath(navpaths[i]);
        }
      }
    }
  });
}

async function loadMapModel() {
  const glb = await glTFLoader.loadAsync(fileUrl.href);
  const model = glb.scene;
  console.log({ glb, bricksTexture, stoneTexture });

  scene.add(model);
  return model;
}

function setupPathfinder(model) {
  pathfinding = new Pathfinding();

  if (!navmesh && model.isObject3D && model.children.length) {
    navmesh = model.getObjectByName("Navmesh");

    pathfinding.setZoneData(ZONE_ID, Pathfinding.createZone(navmesh.geometry));
  }

  for (const _ of agentBlueprints) {
    const pathfindingHelper = new PathfindingHelper();
    console.log("setupPathfinder", { navmesh, pathfinding, pathfindingHelper });
    scene.add(pathfindingHelper);
    pathfindingHelpers.push(pathfindingHelper);
  }
}

async function setupMapTextures(glb) {
  bricksTexture = await new THREE.TextureLoader().loadAsync("/assets/bricksTexture.jpeg");
  stoneTexture = await new THREE.TextureLoader().loadAsync("/assets/stoneTexture.jpeg");

  glb.traverse((obj, i) => {
    if (obj.isMesh) {
      switch (obj.name) {
        case "Navmesh":
          obj.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1 });
          break;
        default:
          {
            const texture = bricksTexture.clone();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(25, 25);
            obj.material = new THREE.MeshBasicMaterial({ color: 0xca947d, map: texture });
          }
          break;
      }
    }
  });
}

function setupAgents() {
  agentBlueprints.forEach((agent) => {
    const agentRadius = 0.25;
    const agentHeight = 1;
    const agentGeometry = new THREE.CylinderGeometry(agentRadius, 0, agentHeight);
    const agentMaterial = new THREE.MeshBasicMaterial({ color: agent.color });
    const agentMesh = new THREE.Mesh(agentGeometry, agentMaterial);
    agentMesh.lookAt(new THREE.Vector3(0, 1, 0));
    agentGroup = new THREE.Group();
    agentGroup.position.set(agent.pos.x, agent.pos.y, agent.pos.z);
    agentGroup.add(agentMesh);
    agentGroups.push(agentGroup);
    scene.add(agentGroup);
  });
}

export async function runMyMapDemo3() {
  setup();

  const model = await loadMapModel();

  setupAgents();

  await setupMapTextures(model);

  setupPathfinder(model);

  renderer.setAnimationLoop(animate);
}

function moveAgents(deltaTime) {
  for (let i = 0; i < agentGroups.length; i++) {
    if (!navpaths[i] || navpaths[i].length <= 0) {
      console.log(i, "DONE");
      return;
    }

    let targetPos = navpaths[i][0];
    const agentGroup = agentGroups[i];
    const velocity = targetPos.clone().sub(agentGroup.position);

    if (velocity.lengthSq() > 0.5 * 0.005) {
      agentGroup.lookAt(targetPos);

      velocity.normalize();
      const finalVel = velocity.multiplyScalar(deltaTime * agentBlueprints[i].speed);
      //   console.log(i, velocity.lengthSq(), finalVel);
      agentGroup.position.add(finalVel);
    } else {
      navpaths[i].shift();
    }
  }
}

function animate() {
  moveAgents(clock.getDelta());
  orbit.update();

  renderer.render(scene, camera);
}
