import { _decorator, Component, Collider2D, IPhysics2DContact, Node, BoxCollider2D } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Bullet")
export class Bullet extends Component {
  @property
  speed: number = 800;

  @property
  damage: number = 10;

  start() {
    // Destroy bullet after 2 seconds
    this.scheduleOnce(() => this.node.destroy(), 5);
  }

  onCollisionEnter(otherCollider: Collider2D) {
    if (otherCollider.node.name === "Enemy") {
      // Add enemy damage logic here
      console.log("Hit enemy!");
      this.node.destroy();
    }
  }
}
