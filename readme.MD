FREE 3D ASSETS

https://quaternius.com/

```js
glTFLoader.loadAsync(fileUrl.href).then((gltf) => {
  const model = gltf.scene;
  scene.add(model);

  console.log({ gltf, model });
});
```

```js
// model => Group
// model.children => Object3D
// model.children.children[0] => Group
// model.children.children[1 ...], => Bone
// model.children.children[0].children => SkinnedMesh
```

```js
// navigating the model

model.children[0].children[0].children[5];
// same as
model.getObjectByName("Cube_5");

model.children[0].children[1].children[0];
// same as
model.getObjectByName("Back");
```

### A better way of navigating Models is to visiting https://threejs.org/editor/

if a gltf file contains animations, you are able to play/stop them using the editor in three.org
