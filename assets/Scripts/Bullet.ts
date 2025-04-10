import {
  _decorator,
  Component,
  Collider2D,
  IPhysics2DContact,
  Contact2DType,
} from "cc";
import { EnemyController } from "./EnemyController";

const { ccclass, property } = _decorator;

@ccclass("Bullet")
export class Bullet extends Component {
  @property
  speed: number = 800;

  @property
  damage: number = 10;

  start() {
    // Destroy bullet after 5 seconds
    this.scheduleOnce(() => this.node.destroy(), 5);

    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    if (otherCollider.node.name === "Enemy Zombie_1" || otherCollider.node.name === "Enemy Zombie") {
      otherCollider.node.getComponent(EnemyController).getHit();
      console.log("Bullet hit enemy!");
      // Optional: deal damage here
      this.node.destroy();
    }
  }

  onDestroy() {
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }
}

