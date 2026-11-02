# ProGuard Rules for Speed Escape 3D (com.escape)

# Keep data classes and serialization models
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}

-keepclassmembers enum * { *; }

# Keep LibGDX native bindings & JNI reflection
-keep class com.badlogic.gdx.** { *; }
-keep class com.badlogic.gdx.backends.android.** { *; }

# Compose rules
-keep class androidx.compose.material3.** { *; }
