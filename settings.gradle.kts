pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://oss.sonatype.org/content/repositories/snapshots/") }
        maven { url = java.net.URI("https://s01.oss.sonatype.org/content/repositories/snapshots/") }
    }
}

rootProject.name = "SpeedEscape3D"
include(":app")
