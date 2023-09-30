import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GLTFLoader } from 'three/addons/GLTFLoader.js'; // I get network error if I use this one
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //use this until I ask the teacher

const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  45,
  size.width / size.height,
  0.1,
  100
);
camera.position.x = 14;
camera.position.y = 15;
camera.position.z = 12;
scene.add(camera);

const orbitControls = new OrbitControls(camera, $canvas);
orbitControls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: $canvas,
  //alpha: true,
  antialias: true,
});

//set size of renderer to size object at top.
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const textureBlender = new THREE.TextureLoader().load(
  'assets/bakedTesting.jpg'
);
textureBlender.flipY = -1; //y axis of textures I load is inverted
const material = new THREE.MeshBasicMaterial({ map: textureBlender });

// ========   LOADER   ======== //
const loader = new GLTFLoader(); //to be able to load gltf files - blender

// Load a glTF resource
loader.load(
  // resource URL
  'assets/gameDeviceTwo.glb',
  // called when the resource is loaded
  (gltf) => {
    console.log('gltf:', gltf);
    //loop through each of the children (assign the model to all of the children):
    gltf.scene.traverse((child) => {
      child.material = material; //child of material, is same as material
    });
    scene.add(gltf.scene);

    // gltf.animations; // Array<THREE.AnimationClip>
    // gltf.scene; // THREE.Group
    // gltf.scenes; // Array<THREE.Group>
    // gltf.cameras; // Array<THREE.Camera>
    //  gltf.asset; // Object
  },
  // called while loading is progressing
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  // called when loading has errors
  (error) => {
    console.log('An error happened');
  }
);

//test object: create simple cube
//const geometry = new THREE.BoxGeometry(1, 1, 1);

/* const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
console.log(cube); */

//Draw loop that executes the renderer
const draw = () => {
  renderer.render(scene, camera); //draw the scene
  window.requestAnimationFrame(draw); //call the draw function again!
};

//on resize -> update size, camera and renderer
window.addEventListener('resize', () => {
  //Update size
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  //update camera
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

draw();
