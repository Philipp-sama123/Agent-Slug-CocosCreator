import {
  _decorator,
  Collider2D,
  Component,
  Contact2DType,
  Node,
  Vec3,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("AttackDetector")
export class AttackDetector extends Component {
  // Reference to enemy controller

  onLoad() {
    // Configure collider
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.sensor = true; // Makes it a trigger
      collider.on(Contact2DType.BEGIN_CONTACT, this.onTriggerEnter2D, this);

      // Start disabled by default
      // collider.enabled = false;
    }
  }

  // Correct trigger event parameters
  private onTriggerEnter2D(
    selfCollider: Collider2D,
    otherCollider: Collider2D
  ) {
    console.warn("Collision detected with:", otherCollider.node.name);
    if (otherCollider.node.name === "Player") {
      console.log("PLAYER HIT!");
      // Notify parent enemy controller
    }
  }

  // Call this to enable detection
  public activate() {
    const collider = this.getComponent(Collider2D);
    if (collider) {
      console.warn("ACTIVATEEEE");
      collider.enabled = true;
    }
  }

  // Call this to disable detection
  public deactivate() {
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.enabled = false;
    }
  }
}
