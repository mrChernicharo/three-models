FREE 3D ASSETS

https://quaternius.com/

```js
glTFLoader.loadAsync(fileUrl.href).then((gltf) => {
  const model = gltf.scene;
  scene.add(model);

  console.log({ gltf, model });

  // model.children => Object3D
  // model.children.children[0] => Group
  // model.children.children[1 ...], => Bone
  // model.children.children[0].children => SkinnedMesh
});
```
