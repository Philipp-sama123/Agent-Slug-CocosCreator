import { _decorator, Component, Node, Vec3, Quat } from "cc";
const { ccclass, property } = _decorator;

@ccclass("CameraController")
export class CameraController extends Component {
  @property({ type: Node })
  target: Node = null!;

  @property
  smoothSpeed: number = 0.125;

  @property({ type: Vec3 })
  offset: Vec3 = new Vec3(0, 100, 0);

  update(dt: number) {
    if (this.target) {
      const targetPos = this.target.position.clone().add(this.offset);
      const currentPos = this.node.position;
      currentPos.lerp(targetPos, this.smoothSpeed);
      this.node.setPosition(currentPos);
    }
  }
}
