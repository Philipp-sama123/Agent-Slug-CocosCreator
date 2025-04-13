import { _decorator, Button, Component, Node, NodeEventType } from "cc";
import { Joystick } from "./Joystick";
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

@ccclass("MobileInputController")
export class MobileInputController extends Component {
  @property({ type: Joystick })
  joystick: Joystick;
  @property({ type: Button })
  jumpButton: Button;
  @property({ type: Button })
  shootButton: Button;
  @property({ type: Button })
  slideButton: Button;
  @property({ type: PlayerController })
  player: PlayerController;

  protected onLoad(): void {
    this.jumpButton.node.on(
      Node.EventType.TOUCH_START,
      this.onJumpButtonPressed,
      this
    );
    this.slideButton.node.on(
      Node.EventType.TOUCH_START,
      this.onSlideButtonPressed,
      this
    );
    this.shootButton.node.on(
      Node.EventType.TOUCH_START,
      this.onShootButtonPressed,
      this
    );
  }
  onShootButtonPressed(
    TOUCH_START: NodeEventType,
    onShootButtonPressed: any,
    arg2: this
  ) {
    this.player.shoot();
  }
  onSlideButtonPressed(
    TOUCH_START: NodeEventType,
    onSlideButtonPressed: any,
    arg2: this
  ) {
    this.player.dodge();
  }
  onJumpButtonPressed(
    TOUCH_START: NodeEventType,
    onJumpButtonPressed: any,
    arg2: this
  ) {
    this.player.jump();
  }
  protected update(dt: number): void {
    if (this.joystick) {
      this.player.setHorizontalInput(this.joystick.input.x);
    }
  }
}
