import {
    _decorator,
    Component,
    TiledMap,
    TiledObjectGroup,
    Node,
    BoxCollider2D,
    RigidBody2D,
    ERigidBody2DType,
    Vec3,
    UITransform,
  } from "cc";
  const { ccclass, property } = _decorator;
  
  @ccclass("GroundColliderGenerator")
  export class GroundColliderGenerator extends Component {
    @property({ type: TiledMap })
    tiledMap: TiledMap | null = null;
  
    start() {
      if (!this.tiledMap) {
        console.warn("No TiledMap assigned.");
        return;
      }
  
      const objectGroup: TiledObjectGroup | null =
        this.tiledMap.getObjectGroup("Ground");
      if (!objectGroup) {
        console.warn("Ground layer not found in the tilemap.");
        return;
      }
  
      // Map dimensions: 100 tiles x 25 tiles, 32x32 pixels each.
      const mapSize = this.tiledMap.getMapSize();       // e.g., { width: 100, height: 25 }
      const tileSize = this.tiledMap.getTileSize();       // e.g., { width: 32, height: 32 }
      const mapWidth = mapSize.width * tileSize.width;    // 3200 pixels
      const mapHeight = mapSize.height * tileSize.height; // 800 pixels
  
      const mapNode = this.tiledMap.node;
      // The map node's anchor; for example, (0.5, 0.5) if centered.
      const uiTransform = mapNode.getComponent(UITransform);
      const anchorX = uiTransform ? uiTransform.anchorX : 0.5;
      const anchorY = uiTransform ? uiTransform.anchorY : 0.5;
  
      for (const obj of objectGroup.getObjects()) {
        // Create a new node for the collider.
        const colliderNode = new Node(`ground_collider_${obj.id}`);
        mapNode.addChild(colliderNode);
  
        // Calculate the object's center in the already-flipped coordinates.
        const objCenterX = obj.x + obj.width / 2;
        const objCenterY = obj.y + obj.height / 2;
  
        // Compute the base local coordinates relative to the map node.
        const baseX = objCenterX - mapWidth * anchorX;
        const baseY = objCenterY - mapHeight * anchorY;
  
        let additionalYOffset = obj.height;
  
        // Subtract the additional offset.
        const centerX = baseX;
        const centerY = baseY - additionalYOffset;
  
        colliderNode.setPosition(new Vec3(centerX, centerY));
  
        // Add a static rigid body.
        const rigidBody = colliderNode.addComponent(RigidBody2D);
        rigidBody.type = ERigidBody2DType.Static;
  
        // Add and configure the box collider.
        const box = colliderNode.addComponent(BoxCollider2D);
        box.size.set(obj.width, obj.height);
        box.apply();
  
        console.log(
          `Created collider at (${centerX.toFixed(
            2
          )}, ${centerY.toFixed(2)}) for object id ${obj.id}`
        );
      }
    }
  }
  