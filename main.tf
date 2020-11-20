variable "api_bundle_hash" {
  type = string
}

terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
  }

  backend "remote" {
    organization = "jamesfer"

    workspaces {
      name = "real-estate-map"
    }
  }
}

provider "google" {
  version = "3.5.0"
  project = "real-estate-map-1546133439056"
  region = "australia-southeast1"
}

resource "google_storage_bucket" "heatmap_bucket" {
  name = "real-estate-map-heatmaps"
  location = "AUSTRALIA-SOUTHEAST1"
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 8
    }
  }
}

resource "google_storage_bucket" "function_code_bucket" {
  name = "real-estate-map-function-code"
  location = "AUSTRALIA-SOUTHEAST1"
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 1
    }
  }
}

resource "google_storage_bucket_object" "function_code_bundle" {
  name = "bundle-${var.api_bundle_hash}.zip"
  bucket = google_storage_bucket.function_code_bucket.name
  source = "./build/api/bundle.zip"
}

resource "google_cloudfunctions_function" "function" {
  name = "heatmap-generator"
  description = "Generates heatmap tiles"
  runtime = "nodejs10"
  available_memory_mb = 512
  source_archive_bucket = google_storage_bucket.function_code_bucket.name
  source_archive_object = google_storage_bucket_object.function_code_bundle.name
  trigger_http = true
  entry_point = "handler"
  environment_variables = {
    HEATMAP_BUCKET = google_storage_bucket.heatmap_bucket.name
  }
}

resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.function.project
  region         = google_cloudfunctions_function.function.region
  cloud_function = google_cloudfunctions_function.function.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
