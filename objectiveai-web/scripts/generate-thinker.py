"""
ObjectiveAI Thinker Figure — Blender Generator
================================================
Run in Blender:  Scripting workspace > Open this file > Run Script (Alt+P)

Generates a Thinker character with:
  - Continuous body + tapered legs (single seamless mesh)
  - Rounded rectangular head
  - Head-only translucent shell (glass dome)
  - Dark inset eyes
  - HeadPivot empty for code-driven tilt animation

After running, tweak visually in Blender, then export:
  File > Export > glTF 2.0 (.glb)
    Format: glTF Binary (.glb)
    Check:  Apply Modifiers
    Save:   objectiveai-web/public/models/thinker.glb
"""

import bpy
import math

# ==========================================================================
# PROPORTIONS — edit these to reshape the character
# ==========================================================================

# Body (torso ellipsoid — Blender Z-up)
BODY_RADIUS_X = 0.24        # width
BODY_RADIUS_Y = 0.19        # depth (front-to-back)
BODY_RADIUS_Z = 0.25        # height

# Neck nub (blends into body via remesh)
NECK_RADIUS = 0.09
NECK_Z = 0.30

# Legs (tapered cones, wider at body)
LEG_TOP_RADIUS = 0.09       # where leg meets body
LEG_BOT_RADIUS = 0.035      # foot tip
LEG_HEIGHT = 0.35
LEG_SPREAD = 0.10           # distance from center axis
LEG_Z = -0.375              # cone center

# Head (rounded rectangular box)
HEAD_W = 0.55                # full width
HEAD_D = 0.48                # full depth
HEAD_H = 0.72                # full height
HEAD_BEVEL = 0.06
HEAD_SUBDIV = 2

# Head pivot (neck joint — head tilts from here)
PIVOT_Z = 0.36

# Eyes
EYE_RADIUS = 0.032
EYE_SPACING = 0.12           # from center axis
EYE_INSET = 0.02             # inset from front face
EYE_RISE = 0.08              # above head center

# Shell (head-only translucent dome)
SHELL_SCALE = 1.10
SHELL_BEVEL = 0.07

# Mesh quality
VOXEL_SIZE = 0.02
SMOOTH_ITERS = 4
SMOOTH_FACTOR = 0.5


# ==========================================================================
# HELPERS
# ==========================================================================

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in [bpy.data.meshes, bpy.data.materials]:
        for item in block:
            if item.users == 0:
                block.remove(item)


def bsdf_set(bsdf, name, value, alt=None):
    """Set Principled BSDF input (handles Blender 3.x / 4.x name changes)."""
    inputs = bsdf.inputs
    if name in inputs:
        inputs[name].default_value = value
    elif alt and alt in inputs:
        inputs[alt].default_value = value


def make_material(name, color, roughness=0.25, metallic=0.05,
                  alpha=1.0, transmission=0.0, ior=1.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf_set(bsdf, "Base Color", (*color, 1.0))
    bsdf_set(bsdf, "Roughness", roughness)
    bsdf_set(bsdf, "Metallic", metallic)
    if alpha < 1.0:
        bsdf_set(bsdf, "Alpha", alpha)
        mat.blend_method = 'BLEND'
    if transmission > 0:
        bsdf_set(bsdf, "Transmission", transmission, "Transmission Weight")
        bsdf_set(bsdf, "IOR", ior)
    return mat


def parent_to(children, parent):
    """Parent objects to parent, keeping world transforms."""
    bpy.ops.object.select_all(action='DESELECT')
    for name in children:
        bpy.data.objects[name].select_set(True)
    parent_obj = bpy.data.objects[parent]
    parent_obj.select_set(True)
    bpy.context.view_layer.objects.active = parent_obj
    bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)
    bpy.ops.object.select_all(action='DESELECT')


# ==========================================================================
# BUILD
# ==========================================================================

def create_thinker():
    clear_scene()

    # --- Materials ---
    mat_body = make_material("ThinkerBody",
        color=(0.929, 0.929, 0.949), roughness=0.25, metallic=0.05)

    mat_eye = make_material("ThinkerEye",
        color=(0.165, 0.165, 0.165), roughness=0.6, metallic=0.0)

    mat_shell = make_material("ThinkerShell",
        color=(0.42, 0.36, 1.0), roughness=0.1, metallic=0.0,
        alpha=0.15, transmission=0.8, ior=1.45)

    # ==================================================================
    # BODY + LEGS  (joined -> voxel remesh -> smooth = one continuous mesh)
    # ==================================================================

    parts = []

    # Torso — scaled UV sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "_torso"
    obj.scale = (BODY_RADIUS_X, BODY_RADIUS_Y, BODY_RADIUS_Z)
    bpy.ops.object.transform_apply(scale=True)
    parts.append(obj)

    # Neck nub — small sphere, overlaps body top for seamless merge
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=12, ring_count=8, radius=NECK_RADIUS, location=(0, 0, NECK_Z))
    obj = bpy.context.active_object
    obj.name = "_neck"
    parts.append(obj)

    # Left leg — tapered cone (radius1=bottom/narrow, radius2=top/wide)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=LEG_BOT_RADIUS, radius2=LEG_TOP_RADIUS,
        depth=LEG_HEIGHT,
        location=(-LEG_SPREAD, 0, LEG_Z))
    obj = bpy.context.active_object
    obj.name = "_legL"
    parts.append(obj)

    # Right leg
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=LEG_BOT_RADIUS, radius2=LEG_TOP_RADIUS,
        depth=LEG_HEIGHT,
        location=(LEG_SPREAD, 0, LEG_Z))
    obj = bpy.context.active_object
    obj.name = "_legR"
    parts.append(obj)

    # Join into one object
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()

    body = bpy.context.active_object
    body.name = "Body"

    # Voxel remesh — merges disconnected meshes into one watertight surface
    rm = body.modifiers.new("Remesh", 'REMESH')
    rm.mode = 'VOXEL'
    rm.voxel_size = VOXEL_SIZE
    bpy.ops.object.modifier_apply(modifier="Remesh")

    # Corrective smooth — removes voxel stairstepping
    sm = body.modifiers.new("Smooth", 'SMOOTH')
    sm.factor = SMOOTH_FACTOR
    sm.iterations = SMOOTH_ITERS
    bpy.ops.object.modifier_apply(modifier="Smooth")

    bpy.ops.object.shade_smooth()
    body.data.materials.append(mat_body)

    poly_count = len(body.data.polygons)

    # ==================================================================
    # HEAD  (rounded rectangular box)
    # ==================================================================

    head_world_z = PIVOT_Z + HEAD_H / 2  # head bottom at pivot

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, head_world_z))
    head = bpy.context.active_object
    head.name = "Head"
    head.scale = (HEAD_W, HEAD_D, HEAD_H)
    bpy.ops.object.transform_apply(scale=True)

    bv = head.modifiers.new("Bevel", 'BEVEL')
    bv.width = HEAD_BEVEL
    bv.segments = 4
    bv.affect = 'EDGES'

    ss = head.modifiers.new("Subdivision", 'SUBSURF')
    ss.levels = HEAD_SUBDIV
    ss.render_levels = HEAD_SUBDIV

    bpy.ops.object.shade_smooth()
    head.data.materials.append(mat_body)

    # ==================================================================
    # EYES
    # ==================================================================

    eye_y = HEAD_D / 2 - EYE_INSET          # front face
    eye_z = head_world_z + EYE_RISE          # above head center

    for side, label in [(-1, "EyeL"), (1, "EyeR")]:
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16, ring_count=12, radius=EYE_RADIUS,
            location=(side * EYE_SPACING, eye_y, eye_z))
        obj = bpy.context.active_object
        obj.name = label
        bpy.ops.object.shade_smooth()
        obj.data.materials.append(mat_eye)

    # ==================================================================
    # HEAD SHELL  (translucent dome, head-only)
    # ==================================================================

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, head_world_z))
    shell = bpy.context.active_object
    shell.name = "Shell"
    shell.scale = (HEAD_W * SHELL_SCALE, HEAD_D * SHELL_SCALE, HEAD_H * SHELL_SCALE)
    bpy.ops.object.transform_apply(scale=True)

    bv2 = shell.modifiers.new("Bevel", 'BEVEL')
    bv2.width = SHELL_BEVEL
    bv2.segments = 4
    bv2.affect = 'EDGES'

    ss2 = shell.modifiers.new("Subdivision", 'SUBSURF')
    ss2.levels = HEAD_SUBDIV
    ss2.render_levels = HEAD_SUBDIV

    bpy.ops.object.shade_smooth()
    shell.data.materials.append(mat_shell)

    # ==================================================================
    # HIERARCHY
    # ==================================================================

    # HeadPivot empty — head tilts around this point (neck joint)
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, PIVOT_Z))
    bpy.context.active_object.name = "HeadPivot"

    parent_to(["Head", "EyeL", "EyeR", "Shell"], "HeadPivot")

    # Root empty
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    bpy.context.active_object.name = "Thinker"

    parent_to(["Body", "HeadPivot"], "Thinker")

    # Select root
    bpy.ops.object.select_all(action='DESELECT')
    bpy.data.objects["Thinker"].select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects["Thinker"]

    # ==================================================================
    # DONE
    # ==================================================================

    print("\n=== Thinker figure created ===")
    print(f"  Body polygons: {poly_count}")
    print("  Hierarchy:")
    print("    Thinker (root)")
    print("      Body (continuous mesh: torso + legs)")
    print("      HeadPivot (empty at neck joint)")
    print("        Head (rounded box)")
    print("        EyeL, EyeR")
    print("        Shell (translucent dome)")
    print()
    print("  Export instructions:")
    print("    File > Export > glTF 2.0 (.glb)")
    print("    Format:  glTF Binary (.glb)")
    print("    Check:   Apply Modifiers")
    print("    Save to: objectiveai-web/public/models/thinker.glb")
    print()


# Run
create_thinker()
