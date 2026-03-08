# Code Review Checklist — 2D Sodescroll
# Reference this after EVERY code write or edit before declaring the work done.

---

## 1. Script Structure

- [ ] One responsibility per class — no god scripts
- [ ] `[SerializeField] private` used instead of `public` for inspector fields
- [ ] No `FindObjectOfType` in gameplay code
- [ ] No `Debug.Log` — use `GameLog.Info/Warning/Error()` only
- [ ] No raw `new()` for MonoBehaviours — use `AddComponent` or prefab instantiation
- [ ] `Awake` used for self-setup (GetComponent), `Start` used for cross-ref setup only
- [ ] Coroutines started on the correct owner (not on a potentially-destroyed object)

---

## 2. Event System

- [ ] Cross-system events use `VoidEventChannelSO` (or typed variant) — never a static EventBus
- [ ] C# events (`event Action`) used only WITHIN a single system/class
- [ ] EventChannel SO assets live in `ScriptableObjects/Events/`
- [ ] Listeners call `AddListener` in `OnEnable`, `RemoveListener` in `OnDisable`

---

## 3. Input

- [ ] Uses New Input System: `using UnityEngine.InputSystem`, `Mouse.current.leftButton`
- [ ] No `Input.GetMouseButton` or `Input.GetKeyDown` (old system)
- [ ] Input only read in `PlayerController.Update` — no other script reads raw input

---

## 4. Movement and Physics

- [ ] Movement is 1D rail only: click → raycast Walkable layer → `hit.point.x`
- [ ] `Rigidbody2D` velocity: always preserve Y when setting X (`new Vector2(x, _rb.velocity.y)`)
- [ ] `Time.deltaTime` used for any frame-rate-dependent value (non-physics code)
- [ ] Physics operations in `FixedUpdate`, not `Update`
- [ ] All traversal (rope, elevator, stairs) uses `TraversalVolume` — no bespoke movement scripts

---

## 5. Collider Sizing — KNOWN PITFALL

Unity auto-sizes colliders from the attached sprite's NATIVE pixel size, not the GameObject scale.
Built-in UI sprites are 16px → at PPU 100 = **0.16 world units** regardless of GameObject scale.

- [ ] Collider sizes set EXPLICITLY after `AddComponent<BoxCollider2D>()` in any setup script
- [ ] Never rely on auto-size from built-in sprites (`UISprite.psd`, `Background.psd`, etc.)
- [ ] After any ground/platform creation, verify world collision surface:
      `world_height = localScale.y * collider.size.y`
- [ ] Player standing height = ground_surface_Y + player_collider_half_height_world
      (NOT ground_surface_Y + player_scale_Y / 2)

---

## 6. ScriptableObjects

- [ ] All game config and data lives in SOs — no magic numbers hardcoded in MonoBehaviours
- [ ] SO assets live in `ScriptableObjects/` under the correct subfolder
- [ ] SOs referenced via `[SerializeField]` inspector ref — never loaded with `Resources.Load`

---

## 7. Editor Scripts (Setup, Fix, One-Shot)

- [ ] One-shot `[InitializeOnLoad]` scripts ALWAYS have an `EditorPrefs` gate (`DONE_KEY`)
- [ ] `[InitializeOnLoad]` scripts ALWAYS guard against Play Mode:
      `if (EditorApplication.isPlayingOrWillChangePlaymode) return;`
- [ ] `EditorSceneManager.MarkSceneDirty` / `SaveOpenScenes` NEVER called during Play Mode
- [ ] Every modified child GameObject gets its OWN `EditorUtility.SetDirty(go)` call
      (marking only the root is not enough to save child transform changes)
- [ ] `[InitializeOnLoad]` one-shots ALSO expose a `[MenuItem]` fallback for manual runs
- [ ] `SerializedObject` + `ApplyModifiedProperties()` used when setting component values
      via editor scripts (not direct field assignment on MonoBehaviours)
- [ ] Collider sizes set explicitly in setup scripts — never rely on auto-fit
- [ ] After a one-shot fix runs successfully, add a note in the log to delete the file

---

## 8. Scene Object Conventions

- [ ] Interactables on `Interactable` layer (layer 8), `isTrigger = true`
- [ ] Ground/platforms on `Walkable` layer (layer 7), `isTrigger = false`
- [ ] Player on `Player` layer (layer 6)
- [ ] SpriteRenderer `sortingLayerName` set explicitly (never rely on default)
- [ ] All sprites PPU = 100

---

## 9. TraversalVolume Checklist (any time a traversal is set up)

- [ ] `StartPoint` world Y = upper ground surface Y + player collider half-height (world)
- [ ] `EndPoint` world Y = lower ground surface Y + player collider half-height (world) + 0.1 gap
- [ ] Vertical gap between platforms > player collider world height (or player clips upper ground)
- [ ] `_oneWay = true` for rope; `_oneWay = false` for elevator
- [ ] `_travelSpeed` set (default 2f)
- [ ] `_onComplete` event channel assigned if downstream systems need to know

---

## 10. Architecture Boundaries

- [ ] `PlayerController` is the ONLY click handler — no other script reads mouse input
- [ ] `GameManager` handles boot flow and scene transitions ONLY — no puzzle/UI/palette logic
- [ ] `NarrativePaletteController` publishes state via EventChannels — never directly modifies
      renderers or colors on other objects
- [ ] Red color appears ONLY via `NarrativePaletteController` — never hardcoded per-object

---

## 11. Interaction System

- [ ] `CanInteract(PlayerController)` checked before `Interact(PlayerController)` is called
- [ ] `interactionRadius` check uses `Vector2.Distance(player.position, interactable.position)`
- [ ] `interactionStopOffset` applied as: `stopX = target.x - dir * offset`
- [ ] All interactables extend `InteractableBase` (for highlight toggling) unless there is a
      specific reason not to

---

## 12. Common Bugs to Rule Out Before Closing

- [ ] No null refs: all `[SerializeField]` refs confirmed assigned (check with null guard at boundary)
- [ ] No `StopAllCoroutines` called on a MonoBehaviour that owns traversal coroutines
      (PlayerController uses StopAllCoroutines — verify it doesn't kill TraversalVolume's coroutine,
       which runs on the TraversalVolume itself)
- [ ] `_hasTarget = false` and `_inputLocked = false` are both reset correctly after traversal
- [ ] `Rigidbody2D.bodyType` restored to original value (not hardcoded `Dynamic`) after traversal
- [ ] `rb.velocity = Vector2.zero` called AFTER `bodyType` is restored, not before

---

## Quick Sign-Off

Before marking any code task done, confirm:

1. Compiles with zero errors
2. No new `Debug.Log` introduced
3. No hardcoded magic numbers (use SO or config)
4. Collider sizes explicitly set if a collider was created
5. If an Editor script was written: play mode guard present, DONE_KEY present, MenuItem present
6. TraversalVolume endpoints computed from actual queried collider sizes — not assumed scale
